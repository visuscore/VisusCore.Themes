using Microsoft.Extensions.Options;
using OrchardCore.ResourceManagement;
using VisusCore.ControlRoomTheme.Constants;

namespace VisusCore.ControlRoomTheme;

public class ResourceManagementOptionsConfiguration : IConfigureOptions<ResourceManagementOptions>
{
    private const string Root = "~/" + FeatureIds.Area;
    private const string Scripts = Root + "/js";

    private static readonly ResourceManifest _manifest = new();

    static ResourceManagementOptionsConfiguration()
    {
        _manifest
            .DefineScript(ResourceNames.ControlRoomApp)
            .SetUrl(Scripts + "/App.min.js", Scripts + "/App.js");

        _manifest
            .DefineStyle(ResourceNames.ControlRoomApp)
            .SetUrl(Root + "/css/App.min.css", Root + "/css/App.css");
    }

    public void Configure(ResourceManagementOptions options) => options.ResourceManifests.Add(_manifest);
}
