import time, random, colorsys
import websocket
import board
import neopixel
from gpiozero import Button
import json

# ws = create_connection("ws://kumasan.site:30000")
ws = websocket.WebSocketApp("ws://echo.websocket.org/",
# ws = websocket.WebSocketApp("ws://kumasan.site:8000",
                              on_message = on_message,
                              on_error = on_error,
                              on_close = on_close)

pixels = neopixel.NeoPixel(board.D18, 77, auto_write=False)
# pixels = neopixel.NeoPixel(board.D18, 64)
#0-63:matrix, 64-76:tape

button = Button(4)
sw_status = False
LEDNUM = 13

color = (int(random.random() * 205 + 50), int(random.random() * 205 + 50), int(random.random() * 205 + 50))
send_color = '#%02X%02X%02X' % (color[0],color[1],color[2])

def send_status(status, color):
    sendval = json.dumps({"state": status, "color": send_color})
    ws.send(sendval)
    print(sendval)

def on_message(ws, message):
    print(message)

try: 
    while True:
        if button.is_pressed == True and sw_status == False:
            print("on")
            send_status(True, color)
            sw_status = True
            for i in range(64) :
                pixels[i] = color
            pixels.show()
        if button.is_pressed == False and sw_status == True:
            print("off")
            send_status(False, color)
            sw_status = False
            for i in range(64) :
                pixels[i] = (0, 0, 0)
            pixels.show()

#         c = '#646464'
# color = (int(c[1:3],16),int(c[3:5],16),int(c[5:7],16))

        result =  ws.recv()
        data = json.loads(result)
        print(data)
#         for i in range( LEDNUM ):
#             if data[i]["state"] == true:
#                 pixels[i+64] = 
#         if data["state"] == True:
#             pixels.fill((255,255,255))
#             print("true")
#         else :
#             pixels.fill((0,0,0))
        # time.sleep(1)

except KeyboardInterrupt:
    pass

ws.close()
