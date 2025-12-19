# """
# Custom middleware to exempt /api/ endpoints from CSRF protection.
# API endpoints use token authentication, not session cookies.
# """

# class CSRFExemptApiMiddleware:
#     """Exempt /api/ paths from CSRF checks."""
    
#     def __init__(self, get_response):
#         self.get_response = get_response
    
#     def __call__(self, request):
#         # Disable CSRF checks for API endpoints (they use token auth)
#         if request.path.startswith('/api/'):
#             # log for debugging
#             try:
#                 print(f"[CSRFExemptApiMiddleware] exempting CSRF for: {request.path}")
#             except Exception:
#                 pass
#             request._dont_enforce_csrf_checks = True
        
#         response = self.get_response(request)
#         return response
    
#     def process_view(self, request, view_func, view_args, view_kwargs):
#         """Run before view to disable CSRF for API paths."""
#         if request.path.startswith('/api/'):
#             try:
#                 print(f"[CSRFExemptApiMiddleware.process_view] exempting CSRF for: {request.path}")
#             except Exception:
#                 pass
#             request._dont_enforce_csrf_checks = True
#         return None
