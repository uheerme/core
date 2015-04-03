using System.Web;
using System.Web.Optimization;

namespace Samesound
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/jquery-{version}.js",
                        "~/Scripts/toastr.js"));

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr-*"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                      "~/Scripts/bootstrap.js",
                      "~/Scripts/respond.js"));

            bundles.Add(new ScriptBundle("~/bundles/angular").Include(
                "~/Scripts/angular.min.js",
                "~/Scripts/angular-route.min.js",
                "~/Scripts/angular-ui-router.min.js",
                "~/Scripts/angular-resource.min.js",
                "~/Scripts/angular-animate.min.js",
                "~/Scripts/angular-file-upload-all.min.js",
                "~/Scripts/app/app.js",
                "~/Scripts/app/utils/*.js",
                "~/Scripts/app/modules/home/*.js",
                "~/Scripts/app/modules/channels/*.js",
                "~/Scripts/app/modules/musics/*.js"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                      "~/Content/paper.min.css",
                      "~/Content/toastr.min.css",
                      "~/Content/site.css"));
        }
    }
}
