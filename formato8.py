import argparse

def contar_registros(input_file):
    try:
        with open(input_file, 'r') as f:
            lines = f.readlines()

        registros_validos = [line for line in lines if line.strip()]
        print(f"CANTIDAD_REGISTROS={len(registros_validos)}")

    except FileNotFoundError:
        print(f"❌ Error: Archivo '{input_file}' no encontrado.")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Contar registros válidos de un archivo de oleaje")
    parser.add_argument("input_file", help="Ruta al archivo .txt de entrada")

    args = parser.parse_args()
    contar_registros(args.input_file)
