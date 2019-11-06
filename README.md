# CLOUD / CROWD
照明のスイッチをサーバーに送信して照明自体に返すことで、クラウドに情報を収集し貯めてクライアントに分配するというクラウドの仕組みを表しています。
# REQUIREMENTS
## OS
Ubuntu, Mac
## Library
dotnet 3.0 以上  
https://dotnet.microsoft.com/download  

python 3.7 以上
# HOW TO USE
## ServerSide
dotnet3.0で実装されています。
websocketサーバーを立ち上げます。
```
cd LightServer
dotnet run
```
## ClientSide
### JavaScript Client
javascriptのクライアントです。
Web上でシミュレーターが動きます。
ブラウザでwebgl_loader_stl.htmlにアクセス
### Python Client
```
cd client
sudo python3 neopsocksw.py
```

# LICENSE
MIT LICENSE