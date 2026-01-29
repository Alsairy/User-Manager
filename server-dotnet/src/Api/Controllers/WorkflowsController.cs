using Elsa.Common.Models;
using Elsa.Workflows.Management;
using Elsa.Workflows.Management.Filters;
using Elsa.Workflows.Models;
using Elsa.Workflows.Runtime;
using Elsa.Workflows.Runtime.Messages;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserManager.Api.Authorization;

namespace UserManager.Api.Controllers;

[ApiController]
[Route("api/v1/workflows")]
[Authorize]
public class WorkflowsController : ControllerBase
{
    private static readonly IReadOnlyDictionary<string, string> WorkflowNameMap =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["asset-registration"] = "AssetRegistrationWorkflow",
            ["isnad"] = "IsnadWorkflow",
            ["contract"] = "ContractWorkflow",
            ["crm"] = "CrmWorkflow",
            ["portal"] = "PortalWorkflow",
            ["user-lifecycle"] = "UserLifecycleWorkflow"
        };

    private readonly IWorkflowRuntime _workflowRuntime;
    private readonly IWorkflowDefinitionService _workflowDefinitionService;

    public WorkflowsController(IWorkflowRuntime workflowRuntime, IWorkflowDefinitionService workflowDefinitionService)
    {
        _workflowRuntime = workflowRuntime;
        _workflowDefinitionService = workflowDefinitionService;
    }

    [HttpPost("{name}/start")]
    [HasPermission("workflows:start")]
    public async Task<IActionResult> Start(
        string name,
        [FromBody] StartWorkflowRequest? request,
        CancellationToken cancellationToken)
    {
        var normalizedName = name.Trim();
        var definitionKey = WorkflowNameMap.TryGetValue(normalizedName, out var mappedName)
            ? mappedName
            : normalizedName;

        var definition = await _workflowDefinitionService.FindWorkflowDefinitionAsync(
            new WorkflowDefinitionFilter
            {
                Name = definitionKey,
                VersionOptions = VersionOptions.Latest
            },
            cancellationToken);

        definition ??= await _workflowDefinitionService.FindWorkflowDefinitionAsync(
            new WorkflowDefinitionFilter
            {
                DefinitionId = definitionKey,
                VersionOptions = VersionOptions.Latest
            },
            cancellationToken);

        if (definition is null)
        {
            return NotFound(new { message = $"Workflow '{name}' not found." });
        }

        var client = await _workflowRuntime.CreateClientAsync(cancellationToken);
        var response = await client.CreateAndRunInstanceAsync(
            new CreateAndRunWorkflowInstanceRequest
            {
                WorkflowDefinitionHandle = WorkflowDefinitionHandle.ByDefinitionId(
                    definition.DefinitionId,
                    VersionOptions.Latest),
                CorrelationId = request?.CorrelationId,
                Name = request?.InstanceName,
                Input = request?.Input
            },
            cancellationToken);

        return Ok(new
        {
            response.WorkflowInstanceId,
            response.Status,
            response.SubStatus,
            response.Incidents,
            definitionId = definition.DefinitionId
        });
    }

    public sealed class StartWorkflowRequest
    {
        public string? InstanceName { get; init; }
        public string? CorrelationId { get; init; }
        public Dictionary<string, object>? Input { get; init; }
    }
}
