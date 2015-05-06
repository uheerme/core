using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;

namespace Uheer.Services.Exceptions
{
    /// <summary>
    /// Thrown when a user already has an active channel and asks to open a second one.
    /// </summary>
    public class OwnerAlreadyHasAnActiveChannelException : ApplicationException
    {
        // Summary:
        //     Initializes a new instance of the System.OwnerAlreadyHasAnActiveChannelException class.
        public OwnerAlreadyHasAnActiveChannelException() { }
        //
        // Summary:
        //     Initializes a new instance of the System.OwnerAlreadyHasAnActiveChannelException class with
        //     a specified error message.
        //
        // Parameters:
        //   message:
        //     A message that describes the error.
        public OwnerAlreadyHasAnActiveChannelException(string message) : base(message) { }
        //
        // Summary:
        //     Initializes a new instance of the System.OwnerAlreadyHasAnActiveChannelException class with
        //     serialized data.
        //
        // Parameters:
        //   info:
        //     The object that holds the serialized object data.
        //
        //   context:
        //     The contextual information about the source or destination.
        protected OwnerAlreadyHasAnActiveChannelException(SerializationInfo info, StreamingContext context) : base(info, context) { }
        //
        // Summary:
        //     Initializes a new instance of the System.OwnerAlreadyHasAnActiveChannelException class with
        //     a specified error message and a reference to the inner exception that is
        //     the cause of this exception.
        //
        // Parameters:
        //   message:
        //     The error message that explains the reason for the exception.
        //
        //   innerException:
        //     The exception that is the cause of the current exception. If the innerException
        //     parameter is not a null reference, the current exception is raised in a catch
        //     block that handles the inner exception.
        public OwnerAlreadyHasAnActiveChannelException(string message, Exception innerException) : base(message, innerException) { }
    }
}
