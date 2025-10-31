from ultralytics import YOLO

model=YOLO(r"H:\hussain\PROITBRIDGE\DL_work\dl_yolo_hat\runs\detect\yolov8s_hat\weights\best.pt")

model.predict(source=r"H:\hussain\PROITBRIDGE\DL_work\dl_yolo_hat\dataset\img.png",save=True,conf=0.6)