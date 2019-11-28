#!/usr/bin/env python3
#-*-coding:utf-8-*-
import random
import board
import neopixel
from gpiozero import Button
import json

import websocket
try:
    import thread
except ImportError:
    import _thread as thread
import time

pixels = neopixel.NeoPixel(board.D18, 77, auto_write=False)
# pixels = neopixel.NeoPixel(board.D18, 64)
#0-63:matrix, 64-76:tape

button = Button(4)
LEDNUM = 13

color = (int(random.random() * 205 + 50), int(random.random() * 205 + 50), int(random.random() * 205 + 50))
send_color = '#%02X%02X%02X' % (color[0],color[1],color[2])

lights_data = [{}]

def send_status(status, color):
    sendval = json.dumps({"state": status, "color": send_color})
    ws.send(sendval)

def is_json(myjson):
    try:
        json_object = json.loads(myjson)
    except ValueError:
        return False
    return True

def on_message(ws, message):
    global lights_data

    if is_json(message):
        mes = json.loads(message)
        if 'type' in mes:
            if mes['type'] == 'Group':
                lights_data = mes['clients']
                print(lights_data)
                for i in range(len(lights_data)):
                    if lights_data[i]['state']:
                        c = lights_data[i]['color']
                        color = (int(c[1:3],16),int(c[3:5],16),int(c[5:7],16))
                        pixels[i+64] = color
                    else:
                        pixels[i+64] = (0, 0, 0)
                pixels.show()
        else:
            is_new = True
            for i in range(len(lights_data)):
                if mes['id'] == lights_data[i]['id']:
                    is_new = False
                    lights_data[i]['state'] = mes['state']
                    if mes['state']:
                        c = lights_data[i]['color']
                        color = (int(c[1:3],16),int(c[3:5],16),int(c[5:7],16))
                        pixels[i+64] = color
                    else:
                        pixels[i+64] = (0, 0, 0)
                    pixels.show()
            if is_new and len(lights_data) < LEDNUM-1:
                lights_data.append(mes)
        if 'event' in mes:
            if mes['event'] == 'close':
                for i in range(len(lights_data)):
                    if mes['id'] == lights_data[i]['id']:
                        lights_data.pop(i)
   




    # else:
        # print( mes)


def on_error(ws, error):
    print(error)

def on_close(ws):
    print("### closed ###")
    pixels.fill((0, 0, 0))
    pixels.show()

def on_open(ws):
    def run(*args):
        sw_status = False
        while True:
            if button.is_pressed == True and sw_status == False:
                print("on")
                send_status(True, color)
                sw_status = True
                for i in range(64) :
                    pixels[i] = (int(color[0]*0.2), int(color[1]*0.2), int(color[2]*0.2))
                pixels.show()
            if button.is_pressed == False and sw_status == True:
                print("off")
                send_status(False, color)
                sw_status = False
                for i in range(64) :
                    pixels[i] = (0, 0, 0)
                pixels.show()
            # ws.close()
        print("thread terminating...")
    thread.start_new_thread(run, ())


if __name__ == "__main__":
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp("ws://kumasan.site:30000",
                              on_message = on_message,
                              on_error = on_error,
                              on_close = on_close)
    ws.on_open = on_open
    ws.run_forever()