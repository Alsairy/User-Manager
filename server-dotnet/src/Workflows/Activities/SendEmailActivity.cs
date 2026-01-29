using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Models;
using Microsoft.Extensions.DependencyInjection;
using UserManager.Application.Interfaces;

namespace UserManager.Workflows.Activities;

public class SendEmailActivity : CodeActivity<bool>
{
    public Input<string> To { get; set; } = default!;
    public Input<string> Subject { get; set; } = default!;
    public Input<string> Body { get; set; } = default!;
    public Input<string?> TemplateKey { get; set; } = default!;
    public Input<object?> TemplateModel { get; set; } = default!;

    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        var to = To.Get(context);
        var subject = Subject.Get(context);
        var body = Body.Get(context);
        var templateKey = TemplateKey.Get(context);
        var templateModel = TemplateModel.Get(context);

        if (string.IsNullOrEmpty(to))
        {
            context.SetResult(false);
            return;
        }

        var emailService = context.GetRequiredService<IEmailService>();

        try
        {
            if (!string.IsNullOrEmpty(templateKey) && templateModel != null)
            {
                await emailService.SendTemplatedAsync(to, templateKey, templateModel, CancellationToken.None);
            }
            else
            {
                await emailService.SendAsync(to, subject, body, CancellationToken.None);
            }

            context.SetResult(true);
        }
        catch
        {
            context.SetResult(false);
        }
    }
}
