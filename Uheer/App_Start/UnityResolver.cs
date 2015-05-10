﻿using Microsoft.Practices.Unity;
using System;
using System.Collections.Generic;
using System.Web.Http.Dependencies;

namespace Uheer.App_Start
{
    /// <summary>
    /// The IoC resolver module.
    /// </summary>
    public class UnityResolver : IDependencyResolver
    {
        /// <summary>
        /// The injected container.
        /// </summary>
        protected IUnityContainer container;

        /// <summary>
        /// Default UnityResolver constructor.
        /// </summary>
        /// <param name="container">The container that will be resolved.</param>
        public UnityResolver(IUnityContainer container)
        {
            if (container == null)
            {
                throw new ArgumentNullException("container");
            }
            this.container = container;
        }

        public object GetService(Type serviceType)
        {
            try
            {
                return container.Resolve(serviceType);
            }
            catch (ResolutionFailedException)
            {
                return null;
            }
        }

        public IEnumerable<object> GetServices(Type serviceType)
        {
            try
            {
                return container.ResolveAll(serviceType);
            }
            catch (ResolutionFailedException)
            {
                return new List<object>();
            }
        }

        public IDependencyScope BeginScope()
        {
            var child = container.CreateChildContainer();
            return new UnityResolver(child);
        }

        public void Dispose()
        {
            container.Dispose();
        }
    }
}