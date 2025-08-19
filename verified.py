import sys
import os
import logging

# Logs a stderr con timestamp y nivel
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    stream=sys.stderr
)

def analizar_archivo(ruta):
    logging.info("Entrando a analizar_archivo")
    logging.info(f"Ruta recibida: {ruta!r}")

    if not os.path.isfile(ruta):
        logging.error("El archivo no existe o no es un archivo regular.")
        return

    try:
        logging.info("Abriendo archivo en modo lectura UTF-8…")
        with open(ruta, 'r', encoding='utf-8') as archivo:
            contenido = archivo.read()
        logging.info(f"Lectura OK. Tamaño del contenido: {len(contenido)} caracteres.")

        # Separar por <FINISH>
        partes = contenido.split('<FINISH>')
        logging.info(f"Split por '<FINISH>' realizado. Partes encontradas: {len(partes)}")

        cantidad = len(partes) - 1
        logging.info(f"Cantidad de registros detectados por marcador <FINISH>: {cantidad}")

        # Imprimir registros (se mantiene por stdout)
        for idx, bloque in enumerate(partes[:-1], start=1):
            registro = bloque.strip()
            if registro:
                print(registro)
            else:
                logging.warning(f"Registro #{idx} está vacío tras strip().")

        # Último registro antes de <FINISH>
        if len(partes) > 1:
            ult_registro_crudo = partes[-2].strip()
            logging.info(f"Último registro crudo (previo a <FINISH>) longitud: {len(ult_registro_crudo)}")
        else:
            ult_registro_crudo = ""

        if not ult_registro_crudo:
            logging.error("No se encontró el último registro correctamente.")
            return

        try:
            numero_ultimo = int(ult_registro_crudo.split(',')[0].strip())
            logging.info(f"Número del último registro parseado: {numero_ultimo}")
        except (ValueError, IndexError) as e:
            logging.error(f"No se pudo obtener el número del último registro: {e}")
            return

        delta = numero_ultimo - cantidad

        # Mensajes de control por stderr (vía logging)
        logging.info(f"Total de registros (por <FINISH>): {cantidad}")
        logging.info(f"Número del último registro declarado: {numero_ultimo}")
        logging.info(f"Diferencia (delta): {delta}")

    except Exception as e:
        logging.exception(f"Error al procesar el archivo: {e}")

if __name__ == "__main__":
    logging.info("Boot del script verified.py")
    logging.info(f"Argumentos recibidos: {sys.argv!r}")
    logging.info(f"Versión de Python: {sys.version.split()[0]}")
    if len(sys.argv) != 2:
        logging.error("Uso incorrecto. Ejemplo: python3 verified.py ruta_del_archivo")
        print("Uso: python3 verified.py ruta_del_archivo", file=sys.stderr)
    else:
        analizar_archivo(sys.argv[1])
