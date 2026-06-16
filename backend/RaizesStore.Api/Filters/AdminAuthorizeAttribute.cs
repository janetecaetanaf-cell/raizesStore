using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using RaizesStore.Api.Options;

namespace RaizesStore.Api.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AdminAuthorizeAttribute : Attribute, IAuthorizationFilter
{
    public bool Skip { get; set; }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        if (Skip)
        {
            return;
        }

        var options = context.HttpContext.RequestServices
            .GetRequiredService<IOptions<AdminOptions>>().Value;

        var email = context.HttpContext.Request.Headers["X-User-Email"].FirstOrDefault();
        if (!options.IsAdmin(email))
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                message = "Acesso restrito ao administrador da loja.",
            });
        }
    }
}
