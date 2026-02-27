from PIL import Image

def analyze_grid():
    img = Image.open('SpriteSheet.png').convert('RGB')
    w, h = img.size
    pix = img.load()
    
    # 找左上角的 checkerboard 颜色和大小
    color_0 = pix[0,0]
    grid_size_x = 0
    for x in range(w):
        if pix[x,0] != color_0:
            grid_size_x = x
            break
            
    print(f"Top-left color: {color_0}")
    print(f"Checkerboard grid size: {grid_size_x}")
    
    # 找马里奥的红色边界
    # 红色约 248, 56, 0 或者是 200, 76, 12 等纯色。
    # 扫描寻找大致的红色边界
    found = False
    for y in range(h):
        for x in range(w):
            r,g,b = pix[x,y]
            if r > 180 and g < 100 and b < 100:
                print(f"First Mario red found at ({x}, {y}), color: ({r},{g},{b})")
                found = True
                break
        if found: break

    # 找砖块的地形第一行（棕色类）
    found = False
    for y in range(h):
        for x in range(w):
            r,g,b = pix[x,y]
            # 砖块是偏橙棕色的，找连续棕色块
            if 150 < r < 220 and 50 < g < 150 and b < 80:
                if y > 200: # 地形在下方
                    print(f"Ground/Brick color found at ({x}, {y}), color: ({r},{g},{b})")
                    found = True
                    break
        if found: break

if __name__ == '__main__':
    try:
        analyze_grid()
    except Exception as e:
        print("Error:", e)
