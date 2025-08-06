import json
import argparse
import sys

def parse_line_to_json(line):
    values = line.strip().split(',')

    if len(values) < 16:
        raise ValueError(f"Línea con columnas insuficientes: {len(values)}")

    burst_number = int(values[0])
    timestamp = {
        "Year": values[1],
        "Month": values[2],
        "Day": values[3],
        "Hour": values[4],
        "Minute": values[5],
        "Second": values[6],
        "Centisecond": values[7]
    }

    Hs = float(values[8])
    Tp = float(values[9])
    Dp = float(values[10])
    Depth_mm = float(values[11])
    H1_10 = float(values[12])
    Tmean = float(values[13])
    Dmean = float(values[14])
    bins = int(values[15])

    Depth_m = Depth_mm / 1000

    profile_raw = values[16:]
    profile = []
    for i in range(0, len(profile_raw)-1, 2):
        try:
            magnitude = float(profile_raw[i])
            direction = int(profile_raw[i+1])
            profile.append({
                "Magnitude": magnitude,
                "Direction": direction
            })
        except (ValueError, IndexError):
            continue

    desired_levels = [1, 20, 38]
    filtered_profile = []
    for level in desired_levels:
        if level <= len(profile):
            entry = profile[level - 1]
            entry["DepthLevel"] = level
            filtered_profile.append(entry)

    return {
        "Burst#": burst_number,
        "Timestamp": timestamp,
        "Hs": Hs,
        "Tp": Tp,
        "Dp": Dp,
        "Depth": round(Depth_m, 3),
        "H1/10": H1_10,
        "Tmean": Tmean,
        "Dmean": Dmean,
        "#bins": bins,
        "Profile": filtered_profile
    }


def main():
    parser = argparse.ArgumentParser(description="Parse wave log Format 8 to JSON")
    parser.add_argument("input_file", help="Path to the input .txt file")

    args = parser.parse_args()
    input_file = args.input_file

    registros = []
    total_lineas = 0
    lineas_invalidas = 0

    try:
        with open(input_file, 'r') as f:
            lines = f.readlines()

        print(f"📝 El archivo contiene {len(lines)} líneas.", file=sys.stderr)

        for idx, line in enumerate(lines, 1):
            if line.strip():
                print(f"[Línea {idx}] {line.strip()}", file=sys.stderr)
                total_lineas += 1
                try:
                    result = parse_line_to_json(line)
                    registros.append(result)
                except Exception as e:
                    lineas_invalidas += 1
                    print(f"⚠️ Línea {idx} inválida omitida: {e}", file=sys.stderr)

        print(f"CANTIDAD_TOTAL_LINEAS={total_lineas}", file=sys.stderr)
        print(f"CANTIDAD_REGISTROS_VALIDOS={len(registros)}", file=sys.stderr)
        print(f"CANTIDAD_LINEAS_INVALIDAS={lineas_invalidas}", file=sys.stderr)

        for registro in registros:
            print(json.dumps(registro))

    except FileNotFoundError:
        print(f"❌ Error: Archivo '{input_file}' no encontrado.", file=sys.stderr)
    except Exception as e:
        print(f"❌ Error inesperado: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
