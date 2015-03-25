using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;

namespace Samesound.Services.Exceptions
{
    /// <summary>
    /// Thrown if an Channel is already deactivated and an invalid operation is executed over it.
    /// </summary>
    public class DeactivatedChannelException : ApplicationException
    {
        // Summary:
        //     Initializes a new instance of the System.DeactivatedChannelException class.
        public DeactivatedChannelException() { }
        //
        // Summary:
        //     Initializes a new instance of the System.DeactivatedChannelException class with
        //     a specified error message.
        //
        // Parameters:
        //   message:
        //     A message that describes the error.
        public DeactivatedChannelException(string message) : base(message) { }
        //
        // Summary:
        //     Initializes a new instance of the System.DeactivatedChannelException class with
        //     serialized data.
        //
        // Parameters:
        //   info:
        //     The object that holds the serialized object data.
        //
        //   context:
        //     The contextual information about the source or destination.
        protected DeactivatedChannelException(SerializationInfo info, StreamingContext context) : base(info, context) { }
        //
        // Summary:
        //     Initializes a new instance of the System.DeactivatedChannelException class with
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
        public DeactivatedChannelException(string message, Exception innerException) : base(message, innerException) { }
    }
}
