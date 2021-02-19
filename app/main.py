from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO, emit
from collections import defaultdict
from pathlib import Path
import random
import eventlet
import sqlite3

eventlet.monkey_patch()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'super_secret_000'
socketio = SocketIO(app)

ROOT = Path(app.root_path)
DB = ROOT / 'model' / 'grid.db'
MAX_CELLS = 1000

@app.route('/', methods=['GET'])
def homepage():
    return render_template('index.html')

@app.route('/get_document', methods=['GET'])
def get_document():
    with sqlite3.connect(DB) as conn:
        c = conn.cursor()
        c.execute("""SELECT * FROM grid""")
        rows = c.fetchall()
    doc = [c if c else ' ' for x, y, c in rows]
    return jsonify(doc)

@socketio.on('initialize')
def initialize(json, methods=['POST']):
    rand_x = random.randint(0, MAX_CELLS - json['n_cells_w'] - 2)
    rand_y = random.randint(0, MAX_CELLS - json['n_cells_h'] - 2)
    rand_x = 0
    rand_y = 0
    with sqlite3.connect(DB) as conn:
        c = conn.cursor()
        c.execute(f"""
            SELECT * FROM grid
            WHERE 
                X >= {rand_x} AND X <= {rand_x + json['n_cells_w']-1}
                AND Y >= {rand_y} AND Y <= {rand_y + json['n_cells_h']-1}
        """)
        rows = c.fetchall()
    data = defaultdict(lambda: {})
    for x, y, c in rows:
        data[x][y] = c
    emit('update_grid', data)

@socketio.on('edit_cell')
def edit_cell(json, methods=['GET', 'POST']):
    socketio.emit('update_cell', json, include_self=False)
    with sqlite3.connect(DB) as conn:
        c = conn.cursor()
        c.execute(f"""
            UPDATE grid 
            SET char = '{ json['value'] }'
            WHERE X = { json['X'] } AND Y = { json['Y'] }
        """)
        conn.commit()

def create_table():
    with sqlite3.connect(DB) as conn:
        c = conn.cursor()
        c.execute("""
            CREATE TABLE IF NOT EXISTS grid (
                X INTEGER,
                Y INTEGER,
                char CHARACTER(1) NOT NULL,
                PRIMARY KEY (X, Y)
            )
        """)
        # for x in range(MAX_CELLS):
        #     for y in range(MAX_CELLS):
        #         c.execute(f"""
        #             INSERT INTO grid (X, Y, char)
        #             VALUES ({ x }, { y }, ' ')
        #         """)
        conn.commit()

if __name__ == '__main__':
    # create_table()
    socketio.run(app, debug=True)