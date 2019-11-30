using System;

namespace LightServer
{
    class Program
    {
        static void Main(string[] args)
        {
            var mainServer = new MainServer();
            var mst = mainServer.Start(30000);
            var infoServer = new InfoServer(mainServer);
            var ist = infoServer.Start(33000);

            var tmp = infoServer.SendInfo();

            mst.Wait();
            ist.Wait();
        }
    }
}
