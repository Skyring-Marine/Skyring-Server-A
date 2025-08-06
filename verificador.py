import sys
import os

def insertar_separadores(ruta):
    try:
        with open(ruta, 'r', encoding='utf-8') as f:
            lineas = f.readlines()

        nombre_salida = ruta.replace('.TXT', '_verified.TXT')

        with open(nombre_salida, 'w', encoding='utf-8') as f:
            for linea in lineas:
                if linea.strip():
                    f.write(linea.rstrip() + '\n<FINISH>\n')

        print(f'Archivo corregido generado: {nombre_salida}')
    
    except Exception as e:
        print(f'Ocurrió un error: {e}')

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python verificar.py ruta_del_archivo")
    else:
        ruta = sys.argv[1]
        insertar_separadores(ruta)