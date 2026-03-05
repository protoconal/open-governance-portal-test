// PluginLoader.cs — Discovers and loads IPlugin implementations at startup.
//
// Design rationale
// ----------------
// Plugins are discovered in two ways (ADR-003):
//   1. Assembly scanning  — assemblies already referenced by the host project
//      (compile-time plugins such as the bundled sample plugins).
//   2. Directory probe    — .dll files placed in the configured "plugins"
//      folder are loaded at runtime via Assembly.LoadFrom.
//
// This gives operators the flexibility to add or remove plugins simply by
// dropping assemblies into a folder without recompiling the host.
//
// Traceability: ADR-003 — Plugin Discovery

using System.Reflection;
using GovernancePortal.Core.Interfaces;

namespace GovernancePortal.Api.PluginLoader;

/// <summary>
/// Locates all <see cref="IPlugin"/> implementations available to the host and
/// returns concrete instances ready for registration.
/// </summary>
public static class PluginDiscovery
{
    /// <summary>
    /// Returns one instance of every non-abstract class that implements
    /// <see cref="IPlugin"/> found in:
    /// <list type="bullet">
    ///   <item>The executing assembly and all assemblies already loaded into
    ///   the current <see cref="AppDomain"/>.</item>
    ///   <item>Any *.dll files inside <paramref name="pluginsDirectory"/> (if
    ///   the directory exists).</item>
    /// </list>
    /// </summary>
    /// <param name="pluginsDirectory">
    /// Absolute or relative path to a folder that may contain additional
    /// plugin assemblies.  Pass <c>null</c> to skip directory probing.
    /// </param>
    public static IReadOnlyList<IPlugin> Discover(string? pluginsDirectory = null)
    {
        // Force-load all assemblies that sit next to the executing assembly
        // (i.e. compile-time plugin references that .NET defers loading until
        // first use).  Without this, AppDomain only contains the host assembly
        // and the plugins remain invisible to the scanner.
        var baseDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)!;
        foreach (var dll in Directory.EnumerateFiles(baseDir, "GovernancePortal.Plugins.*.dll"))
        {
            try { Assembly.LoadFrom(dll); }
            catch { /* ignore; already loaded or incompatible */ }
        }

        var assemblies = AppDomain.CurrentDomain.GetAssemblies().ToList();

        // ── Directory probe ───────────────────────────────────────────────
        if (!string.IsNullOrWhiteSpace(pluginsDirectory)
            && Directory.Exists(pluginsDirectory))
        {
            foreach (var dll in Directory.EnumerateFiles(pluginsDirectory, "*.dll"))
            {
                try
                {
                    assemblies.Add(Assembly.LoadFrom(dll));
                }
                catch (Exception ex)
                {
                    // Log and continue; a bad plugin should not crash the host.
                    Console.Error.WriteLine($"[PluginDiscovery] Failed to load '{dll}': {ex.Message}");
                }
            }
        }

        // ── Type scan ─────────────────────────────────────────────────────
        var pluginType = typeof(IPlugin);
        var plugins = new List<IPlugin>();

        foreach (var assembly in assemblies.Distinct())
        {
            IEnumerable<Type> candidates;
            try
            {
                candidates = assembly.GetTypes();
            }
            catch (ReflectionTypeLoadException ex)
            {
                candidates = ex.Types.OfType<Type>();
            }

            foreach (var type in candidates)
            {
                if (!type.IsAbstract
                    && !type.IsInterface
                    && pluginType.IsAssignableFrom(type))
                {
                    try
                    {
                        plugins.Add((IPlugin)Activator.CreateInstance(type)!);
                    }
                    catch (Exception ex)
                    {
                        Console.Error.WriteLine(
                            $"[PluginDiscovery] Could not instantiate plugin '{type.FullName}': {ex.Message}");
                    }
                }
            }
        }

        return plugins.AsReadOnly();
    }
}
