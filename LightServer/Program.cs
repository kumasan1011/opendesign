using System;

namespace LightServer
{
    class Program
    {
        static void Main(string[] args)
        {
            var server = new Server();
            server.Start(30000).Wait();
        }
    }
}
