from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"message": "API está funcionando!"})

if __name__ == '__main__':
    # print("Iniciando a API na porta 5000...")
    print("Iniciando a API na porta 3001...")
    # app.run(debug=True, port=5000)
    app.run(debug=True, port=3001)