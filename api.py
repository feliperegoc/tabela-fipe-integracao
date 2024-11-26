from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import os

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

def get_db_connection():
    try:
        return psycopg2.connect(
            dbname=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            host=os.getenv('DB_HOST')
        )
    except Exception as e:
        print(f"Erro ao conectar ao banco: {e}")
        return None

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "API FIPE - Use /api/marcas para consultar as marcas disponíveis"})

@app.route('/api/marcas', methods=['GET'])
def get_marcas():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT DISTINCT marca FROM d_carro ORDER BY marca")
    marcas = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([marca['marca'] for marca in marcas])

@app.route('/api/modelos/<marca>', methods=['GET'])
def get_modelos_por_marca(marca):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT DISTINCT modelo 
        FROM d_carro 
        WHERE marca = %s 
        ORDER BY modelo
    """, (marca,))
    modelos = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([modelo['modelo'] for modelo in modelos])

@app.route('/api/anos/<marca>', methods=['GET'])
def get_anos_por_marca(marca):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT DISTINCT ano 
        FROM d_carro 
        WHERE marca = %s 
        ORDER BY ano DESC
    """, (marca,))
    anos = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([ano['ano'] for ano in anos])

@app.route('/api/modelos/<marca>/<ano>', methods=['GET'])
def get_modelos_por_marca_e_ano(marca, ano):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT DISTINCT modelo 
        FROM d_carro 
        WHERE marca = %s AND ano = %s 
        ORDER BY modelo
    """, (marca, ano))
    modelos = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([modelo['modelo'] for modelo in modelos])

@app.route('/api/anos-por-modelo/<marca>/<modelo>', methods=['GET'])
def get_anos_por_modelo(marca, modelo):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT DISTINCT ano 
        FROM d_carro 
        WHERE marca = %s AND modelo = %s
        ORDER BY ano DESC
    """, (marca, modelo))
    anos = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([ano['ano'] for ano in anos])

@app.route('/api/combustiveis/<marca>/<modelo>/<ano>', methods=['GET'])
def get_combustiveis(marca, modelo, ano):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT DISTINCT combustivel 
        FROM d_carro 
        WHERE marca = %s AND modelo = %s AND ano = %s 
        ORDER BY combustivel
    """, (marca, modelo, ano))
    combustiveis = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([c['combustivel'] for c in combustiveis])

@app.route('/api/precos', methods=['GET'])
def get_precos():
    marca = request.args.get('marca')
    modelo = request.args.get('modelo')
    ano = request.args.get('ano')
    combustivel = request.args.get('combustivel')
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Primeiro, pegamos o ID do carro
    cur.execute("""
        SELECT id 
        FROM d_carro 
        WHERE marca = %s AND modelo = %s AND ano = %s AND combustivel = %s
    """, (marca, modelo, ano, combustivel))
    
    result = cur.fetchone()
    if not result:
        cur.close()
        conn.close()
        return jsonify({'error': 'Veículo não encontrado'}), 404
    
    carro_id = result['id']
    
    # Agora pegamos o histórico de preços
    cur.execute("""
        SELECT data_referencia, preco 
        FROM f_carrovariacao 
        WHERE id = %s 
        ORDER BY data_referencia DESC
    """, (carro_id,))
    
    precos = cur.fetchall()
    cur.close()
    conn.close()
    
    # Formatando as datas e organizando os dados
    formatted_precos = []
    for i, p in enumerate(precos):
        if i == 0:
            label = "Valor Atual"
        else:
            data = datetime.strftime(p['data_referencia'], '%B/%Y').capitalize()
            label = data
        
        formatted_precos.append({
            'label': label,
            'valor': float(p['preco'])
        })
    
    return jsonify(formatted_precos)

@app.route('/api/sugestoes', methods=['GET'])
def get_sugestoes():
    valores = request.args.getlist('valores[]')
    if not valores:
        return jsonify({'error': 'Nenhum valor fornecido'}), 400
        
    # Converte valores para números
    valores_numericos = [float(valor) for valor in valores]
    media = sum(valores_numericos) / len(valores_numericos)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Busca 5 veículos abaixo da média e 5 acima
    cur.execute("""
        WITH current_prices AS (
            SELECT DISTINCT ON (c.id) 
                c.marca, 
                c.modelo, 
                c.ano,
                c.combustivel,
                cv.preco
            FROM d_carro c
            JOIN f_carrovariacao cv ON c.id = cv.id
            WHERE cv.data_referencia = (
                SELECT MAX(data_referencia) 
                FROM f_carrovariacao
            )
        )
        (
            SELECT *
            FROM current_prices
            WHERE preco < %s
            ORDER BY preco DESC
            LIMIT 5
        )
        UNION ALL
        (
            SELECT *
            FROM current_prices
            WHERE preco >= %s
            ORDER BY preco ASC
            LIMIT 5
        )
    """, (media, media))
    
    sugestoes = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify([{
        'marca': s['marca'],
        'modelo': s['modelo'],
        'ano': s['ano'],
        'combustivel': s['combustivel'],
        'preco': float(s['preco'])
    } for s in sugestoes])

if __name__ == '__main__':
    print("Iniciando API FIPE na porta 3001...")
    app.run(debug=True, host='0.0.0.0', port=3001)