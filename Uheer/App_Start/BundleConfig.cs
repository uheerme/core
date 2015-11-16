using System.Web;
using System.Web.Optimization;

namespace Uheer
{
    /// <summary>
    /// Bundle configuration class.
    /// </summary>
    public class BundleConfig
    {
        /// <summary>
        /// Register all bundles required for the web app.
        /// </summary>
        /// <param name="bundles">The bundle that will be configured.</param>
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/code/jquery").Include(
                "~/Scripts/jquery-{version}.min.js",
                "~/Scripts/toastr.min.js"));

            bundles.Add(new ScriptBundle("~/code/modernizr").Include(
                "~/Scripts/modernizr-*"));

            bundles.Add(new ScriptBundle("~/code/bootstrap").Include(
                "~/Scripts/bootstrap.min.js",
                "~/Scripts/respond.min.js"));

            bundles.Add(new ScriptBundle("~/code/audiojs").Include(
                "~/Scripts/audiojs/audio.min.js",
                "~/Scripts/audiojs/audio-initialize.js"));

            bundles.Add(new ScriptBundle("~/code/uheerapp").Include(
                "~/Scripts/angular.min.js",
                "~/Scripts/angular-route.min.js",
                "~/Scripts/angular-ui-router.min.js",
                "~/Scripts/angular-resource.min.js",
                "~/Scripts/angular-animate.min.js",
                "~/Scripts/angular-local-storage.min.js",
                "~/Scripts/ng-file-upload-all.min.js",
                "~/Scripts/app/app.js",
                "~/Scripts/app/services/*.js",
                "~/Scripts/app/modules/shared/*.js",
                "~/Scripts/app/modules/home/*.js",
                "~/Scripts/app/modules/account/*.js",
                "~/Scripts/app/modules/channels/*.js",
                "~/Scripts/app/modules/listen/*.js",
                "~/Scripts/app/modules/status/*.js"));

            bundles.Add(new StyleBundle("~/design/theme").Include(
                "~/Content/bootstrap.min.css"));

            bundles.Add(new StyleBundle("~/design/override").Include(
                      "~/Content/toastr.min.css",
                      "~/Content/site.css"));
        }
    }
}
