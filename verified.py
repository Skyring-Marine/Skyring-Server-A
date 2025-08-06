import sys

def analizar_archivo(ruta):
    try:
        with open(ruta, 'r', encoding='utf-8') as archivo:
            contenido = archivo.read()

            # Separar por <FINISH>
            partes = contenido.split('<FINISH>')
            cantidad = len(partes) - 1

            # Imprimir registros
            for bloque in partes[:-1]:
                registro = bloque.strip()
                if registro:
                    print(registro)

            # Último registro antes de <FINISH>
            ult_registro_crudo = partes[-2].strip() if len(partes) > 1 else ""

            if not ult_registro_crudo:
                print("No se encontró el último registro correctamente.", file=sys.stderr)
                return

            try:
                numero_ultimo = int(ult_registro_crudo.split(',')[0].strip())
            except (ValueError, IndexError):
                print("No se pudo obtener el número del último registro.", file=sys.stderr)
                return

            delta = numero_ultimo - cantidad

            # Mensajes de control solo por stderr
            print(f'Total de registros (por <FINISH>): {cantidad}', file=sys.stderr)
            print(f'Número del último registro declarado: {numero_ultimo}', file=sys.stderr)
            print(f'Diferencia (delta): {delta}', file=sys.stderr)

    except Exception as e:
        print(f'Error al procesar el archivo: {e}', file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python3 verified.py ruta_del_archivo", file=sys.stderr)
    else:
        analizar_archivo(sys.argv[1])
