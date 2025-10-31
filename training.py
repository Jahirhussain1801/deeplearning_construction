from ultralytics import YOLO

model=YOLO("yolov8s.pt")
model.train(data="dataset/data.yaml",epochs=5,imgsz=640,batch=16,name="yolov8s_hat")




