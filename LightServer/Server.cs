using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Net.WebSockets;
using System.Net;
using System.Linq;
using System;

using Newtonsoft.Json;

namespace LightServer
{
    class PackedData
    {
        public PackedData(string t, List<Client> c)
        {
            type = t;
            cs = c;
        }
        [JsonProperty("type")]
        private string type;
        [JsonProperty("clients")]
        private List<Client> cs;
    }

    class Client
    {
        public Client(int i, bool s, WebSocket w)
        {
            id = i;
            state = s;
            ws = w;
            alive = true;
        }

        public void ChangeState()
        {
            state = !state;
        }

        public void Send(byte[] data)
        {
            if (!alive) return;
            Console.WriteLine("send {0}", id);
            ws.SendAsync(data, WebSocketMessageType.Text, true, System.Threading.CancellationToken.None);
        }

        [JsonProperty("id")]
        public int id;
        [JsonProperty("state")]
        public bool state;
        [JsonProperty("color")]
        public string color;
        [JsonProperty("alive")]
        public bool alive;
        [JsonIgnore]
        public WebSocket ws;
    }

    class State
    {
        State()
        {
            on = false;
            color = null;
        }
        [JsonProperty("state")]
        public bool on;
        [JsonProperty("color")]
        public string color;
    }

    class Server
    {
        public Server()
        {
            clients = new List<Client>();
            groups = new List<List<int>>();
            idCount = 0;
        }

        static void SendMessage(int idx, string msg)
        {
            var client = clients[idx];
            Console.WriteLine("send : {0}", msg);
            client.Send(Encoding.GetEncoding("UTF-8").GetBytes(msg));
        }

        static void SendMessageToAllClients(string msg)
        {
            Console.WriteLine("send all : {0}", clients.Count);
            for (int i = 0; i < clients.Count; ++i)
                SendMessage(i, msg);
        }

        static IEnumerable<Client> RamdomPickUp(int except)
        {
            var alives = clients.FindAll(c => (c.alive && c.id != except));
            var orders = alives.OrderBy(i => Guid.NewGuid()).ToArray();
            return orders.Take(LightGroupeSize);
        }

        public async Task Start(int port)
        {
            Console.WriteLine("port : " + port);
            string uri = "http://+:" + port.ToString() + "/";
            // httpListenerで待ち受け
            var httpListener = new HttpListener();
            httpListener.Prefixes.Add(uri);
            httpListener.Start();
            
            while (true)
            {
                // 接続待機
                var listenerContext = await httpListener.GetContextAsync();
                if (listenerContext.Request.IsWebSocketRequest)
                {
                    /// httpのハンドシェイクがWebSocketならWebSocket接続開始
                    var temp = ProcessRequest(listenerContext);
                }
                else
                {
                    /// httpレスポンスを返す
                    listenerContext.Response.StatusCode = 400;
                    listenerContext.Response.Close();
                }
            }
        }

        static async Task ProcessRequest(HttpListenerContext listenerContext)
        {
            Console.WriteLine("{0}:New Session:{1}", DateTime.Now.ToString(), listenerContext.Request.RemoteEndPoint.Address.ToString());
 
            /// WebSocketの接続完了を待機してWebSocketオブジェクトを取得する
            var w = (await listenerContext.AcceptWebSocketAsync(subProtocol:null)).WebSocket;

            var client = new Client(idCount++, false, w);

            Console.WriteLine("connect id {0}", client.id);

            SendMessageToAllClients("{open, " + client.id + "}");

            clients.Add(client);

            var data = new PackedData("Group", RamdomPickUp(client.id).ToList());

            SendMessage(client.id, JsonConvert.SerializeObject(data));

            SendMessage(client.id, JsonConvert.SerializeObject(new PackedData("Others", clients)));

            Console.WriteLine("sendmessage {0}", client.id);
 
            /// WebSocketの送受信ループ
            while (client.ws.State == WebSocketState.Open)
            {
                try
                {
                    var buff = new ArraySegment<byte>(new byte[4096 * 32]);
 
                    /// 受信待機
                    var ret = await client.ws.ReceiveAsync(buff, System.Threading.CancellationToken.None);
 
                    /// テキスト
                    if (ret.MessageType == WebSocketMessageType.Text)
                    {
                        Console.WriteLine("{0}:String Received:{1}", DateTime.Now.ToString(), listenerContext.Request.RemoteEndPoint.Address.ToString());
                        Console.WriteLine("{0}:Message:{1}", client.id, Encoding.UTF8.GetString(buff));
                        var state = JsonConvert.DeserializeObject<State>(Encoding.UTF8.GetString(buff).Substring(0, ret.Count));
                        Console.WriteLine(state.on);
                        client.state = state.on;
                        client.color = state.color;
                        string json = JsonConvert.SerializeObject(client);
                        SendMessageToAllClients(json);
                    }
                    else if (ret.MessageType == WebSocketMessageType.Close) /// クローズ
                    {
                        Console.WriteLine("{0}:Session Close:{1}", DateTime.Now.ToString(), listenerContext.Request.RemoteEndPoint.Address.ToString());
                        break;
                    }
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                    Console.WriteLine("{0}:Session Abort:{1}", DateTime.Now.ToString(), listenerContext.Request.RemoteEndPoint.Address.ToString());
                    break;
                }
            }

            //clients.Remove(client);
            //client.ws.Dispose();

            client.alive = false;

            SendMessageToAllClients("{close, " + client.id + "}");
        }

        static List<Client> clients;
        static List<List<int>> groups;
        static int idCount;
        const int LightGroupeSize = 13;
    }
}
