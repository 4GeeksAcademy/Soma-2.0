from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from api.permisos import tiene_permiso



def rol_requerido(*roles_permitidos):
    """Restringe un endpoint a los roles indicados (valores de RolUsuario, ej. "admin")."""

    def decorador(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("rol") not in roles_permitidos:
                return jsonify(error="no autorizado para este recurso"), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorador

def permiso_requerido(accion):
    """Restringe un endpoint a los usuarios cuyo rol posee una acción específica."""

    def decorador(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            rol_usuario = claims.get("rol")
            if not tiene_permiso(rol_usuario, accion):
                return jsonify(error="no posee los permisos suficientes para esta acción"), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorador