from ultralytics import YOLO


def test_webcam():
    # Load your model
    model = YOLO(r"H:\hussain\PROITBRIDGE\DL_work\dl_yolo_hat\runs\detect\yolov8s_hat\weights\best.pt")

    print("Starting webcam detection...")
    print("Press 'q' to quit the webcam window")

    # Start webcam
    results = model.predict(
        source="0",
        show=True,
        conf=0.5,
        imgsz=640,
        verbose=False
    )

    print("Webcam stopped")


if __name__ == "__main__":
    test_webcam()

