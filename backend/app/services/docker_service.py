import re
import docker
import logging

logger = logging.getLogger("chainproof.docker")

# RFC 1123 / OCI compliant container image name regex
IMAGE_NAME_PATTERN = re.compile(
    r"^[a-zA-Z0-9_\-\.\/]+(:[a-zA-Z0-9_\-\.]+)?(@sha256:[a-fA-F0-9]{64})?$"
)


def validate_image_name(image_name: str) -> str:
    """Validate that the container image identifier is safe and properly formatted."""
    if not image_name or not isinstance(image_name, str):
        raise ValueError("Container image name must be a non-empty string.")
    
    cleaned = image_name.strip()
    if len(cleaned) > 255:
        raise ValueError("Container image name exceeds maximum length of 255 characters.")
    
    if any(char in cleaned for char in [";", "&", "|", "`", "$", "(", ")", "<", ">", "\n", "\r", "\\", " "]):
        raise ValueError("Container image name contains illegal or unsafe characters.")

    if not IMAGE_NAME_PATTERN.match(cleaned):
        raise ValueError(f"Invalid container image reference format: '{cleaned}'")

    return cleaned


def get_docker_client():
    """Retrieve an authenticated Docker client communicating with the local or socket daemon."""
    client = docker.from_env()
    client.ping()
    return client


def check_docker_health() -> dict:
    """Check connectivity to Docker daemon and return status information."""
    try:
        client = get_docker_client()
        version_info = client.version()
        return {
            "connected": True,
            "version": version_info.get("Version", "Unknown"),
            "os": version_info.get("Os", "Unknown"),
            "arch": version_info.get("Arch", "Unknown"),
            "error": None
        }
    except Exception as e:
        return {
            "connected": False,
            "version": None,
            "os": None,
            "arch": None,
            "error": str(e)
        }


def list_local_images() -> list:
    """List images available in the local Docker daemon."""
    try:
        client = get_docker_client()
        images = client.images.list()
        image_list = []
        for img in images:
            tags = img.tags or []
            if not tags:
                continue
            image_list.append({
                "id": img.short_id,
                "tags": tags,
                "size_bytes": img.attrs.get("Size", 0),
                "created": img.attrs.get("Created", "")
            })
        return image_list
    except Exception as e:
        logger.error(f"Failed to list local Docker images: {e}")
        return []


def ensure_image(image_name: str) -> dict:
    """
    Ensure the container image is available on the Docker daemon and retrieve real metadata.
    Does not use fake fallback sizes.
    """
    cleaned_name = validate_image_name(image_name)
    try:
        client = get_docker_client()
        
        # Check if already present locally first
        try:
            image = client.images.get(cleaned_name)
            logger.info(f"Found image '{cleaned_name}' in local Docker cache.")
        except docker.errors.ImageNotFound:
            logger.info(f"Pulling image '{cleaned_name}' via Docker daemon...")
            image = client.images.pull(cleaned_name)

        size_bytes = image.attrs.get("Size", 0)
        root_fs = image.attrs.get("RootFS", {})
        layers = root_fs.get("Layers", []) if isinstance(root_fs, dict) else []

        return {
            "image_name": cleaned_name,
            "size_bytes": size_bytes,
            "layers_count": len(layers),
            "id": image.short_id,
            "architecture": image.attrs.get("Architecture", "unknown"),
            "os": image.attrs.get("Os", "linux")
        }
    except Exception as e:
        logger.error(f"Docker inspection failed for '{cleaned_name}': {e}")
        raise RuntimeError(
            f"Docker daemon error for '{cleaned_name}': {str(e)}. "
            "Please ensure the Docker daemon is running and the image name is valid."
        )