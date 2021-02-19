from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO
from pathlib import Path
import sqlite3
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

ROOT = Path(app.root_path)
DB = ROOT / 'model' / 'grid.db'

@app.route('/', methods=['GET'])
def homepage():
    return render_template('index.html')

@app.route('/data', methods=['GET'])
def show_table():
    with sqlite3.connect(DB) as conn:
        c = conn.cursor()
        c.execute("""SELECT * FROM grid""")
        rows = c.fetchall()
    
    rows = [(int(x), int(y), c) for x, y, c in rows]

    maxX, _, _ = max(rows, key=lambda r: r[0])
    _, maxY, _ = max(rows, key=lambda r: r[1])

    array = [['' for y in range(maxY+1)] for x in range(maxX+1)]

    for x, y, c in rows:
        array[x][y] = c

    return jsonify(array)

@socketio.on('initialize')
def initialize(msg):
    print(str(msg))

@socketio.on('edit_cell')
def edit_cell(json, methods=['GET', 'POST']):
    print(str(json))
    with sqlite3.connect(DB) as conn:
        print(str(json))
        c = conn.cursor()
        c.execute(f"""
            INSERT INTO grid (X, Y, char)
            VALUES ({ json['X'] }, { json['Y'] }, '{ json['value'] }')
        """)
        conn.commit()

def create_table(conn):
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS grid (
            X integer,
            Y integer,
            char CHARACTER(1) NOT NULL,
            PRIMARY KEY (X, Y)
        )
    """)
    c.close()

if __name__ == '__main__':
    socketio.run(app, debug=True)
    conn = sqlite3.connect(DB)
    create_table(conn)

