from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Custom permission to allow only staff/superuser access
    """
    message = "Access denied. Admin privileges required."
    
    def has_permission(self, request, view):
        """
        Check if user is admin (staff or superuser)
        """
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.is_superuser)
        )
