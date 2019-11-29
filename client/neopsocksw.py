#!/usr/bin/env python3
#-*-coding:utf-8-*-
import random
import time
try:
    import thread
except ImportError:
    import _thread as thread
import board
import neopixel
from gpiozero import Button
import json
import requests
import websocket

pixels = neopixel.NeoPixel(board.D18, 60+13, auto_write=False)
#0-60:tape, 64-76:points

button = Button(4)
LEDNUM = 13
CLOUD_LED = 60
mode = 0
tape_att = 0.5
points_att = 0.3

color = (int(random.random() * 205 + 50), int(random.random() * 205 + 50), int(random.random() * 205 + 50))
send_color = '#%02X%02X%02X' % (color[0],color[1],color[2])

lights_data = [{}]

ZIP = "153-0064,JP"
API_KEY = "28e021f5be878b85fed7c65405499234"
api = "http://api.openweathermap.org/data/2.5/forecast?zip={city}&units=metric&lang=ja&APPID={key}"
url = api.format(city = ZIP, key = API_KEY)

def send_status(status, cl):
    tmp_c = '#%02X%02X%02X' % (cl[0],cl[1],cl[2])
    sendval = json.dumps({"state": status, "color": tmp_c})
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
                        pixels[i+CLOUD_LED] = (int(color[0]*points_att), int(color[1]*points_att), int(color[2]*points_att))
                    else:
                        pixels[i+CLOUD_LED] = (0, 0, 0)
                pixels.show()
        else:
            is_new = True
            for i in range(len(lights_data)):
                if mes['id'] == lights_data[i]['id']:
                    is_new = False
                    lights_data[i]['state'] = mes['state']
                    if mes['state']:
                        c = mes['color']
                        print(c)
                        color = (int(c[1:3],16),int(c[3:5],16),int(c[5:7],16))
                        pixels[i+CLOUD_LED] = (int(color[0]*points_att), int(color[1]*points_att), int(color[2]*points_att))
                    else:
                        pixels[i+CLOUD_LED] = (0, 0, 0)
                    pixels.show()
            if is_new and len(lights_data) < LEDNUM-1:
                lights_data.append(mes)
        if 'event' in mes:
            if mes['event'] == 'close':
                for i in range(len(lights_data)):
                    if mes['id'] == lights_data[i]['id']:
                        lights_data.pop(i)

def on_error(ws, error):
    print(error)

def on_close(ws):
    print("### closed ###")
    pixels.fill((0, 0, 0))
    pixels.show()

def on_open(ws):
    def run(*args):
        sw_status = False
        global mode
        while True:
            if button.is_pressed == True and mode == 0:
                mode = 1
                print("on-cool")
                tmp_c = (200, 230, 255)
                send_status(True, tmp_c)
                sw_status = True
                for i in range(CLOUD_LED) :
                    pixels[i] = (int(tmp_c[0]*tape_att), int(tmp_c[1]*tape_att), int(tmp_c[2]*tape_att))
                pixels.show()
            if button.is_pressed == False and mode == 1:
                mode = 2
                print("on-warm")
                tmp_c = (255, 180, 120)
                send_status(True, tmp_c)
                sw_status = True
                for i in range(CLOUD_LED) :
                    pixels[i] = (int(tmp_c[0]*tape_att), int(tmp_c[1]*tape_att), int(tmp_c[2]*tape_att))
                pixels.show()
            if button.is_pressed == True and mode == 2:
                mode = 3
                response = requests.get(url)
                weather_data = json.loads(response.text)['list'][10]['weather'][0]['main']
                if weather_data == "Clouds":
                    tmp_c = (128, 128, 160)
                elif weather_data == "Snow":
                    tmp_c = (128, 255, 255)
                elif weather_data == "Rain":
                    tmp_c = (0, 128, 255)
                elif weather_data == "Clear":
                    tmp_c = (255, 200, 50)
                elif weather_data == "Fog":
                    tmp_c = (50, 100, 100)
                elif weather_data == "Mist":
                    tmp_c = (50, 150, 150)
                elif weather_data == "Haze":
                    tmp_c = (50, 50, 50)
                else:
                    tmp_c = color
                print("on-whether")
                send_status(True, tmp_c)
                sw_status = True
                for i in range(CLOUD_LED) :
                    pixels[i] = (int(tmp_c[0]*tape_att), int(tmp_c[1]*tape_att), int(tmp_c[2]*tape_att))
                pixels.show()
            if button.is_pressed == False and mode == 3:
                mode = 0   
                send_status(False, color)
                for i in range(CLOUD_LED) :
                    pixels[i] = (0, 0, 0)
                pixels.show()

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