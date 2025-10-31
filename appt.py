from flask import Flask, render_template, Response, jsonify, request, send_from_directory
from ultralytics import YOLO
import cv2
import threading
import os
import uuid
import numpy as np

app = Flask(__name__)

# Load your trained model
try:
    model_path = r"H:\hussain\PROITBRIDGE\DL_work\dl_yolo_hat\runs\detect\yolov8s_hat\weights\best.pt"
    model = YOLO(model_path)
    print("✅ YOLO model loaded successfully")
except Exception as e:
    print(f"❌ Error loading YOLO model: {e}")
    model = None

# Configuration
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}

# Create uploads directory if not exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Global variables
current_detection = {
    'hard_hat': 0,
    'vest': 0,
    'no_hard_hat': 0,
    'no_vest': 0,
    'safety_score': 0,
    'access_granted': False,
    'message': 'Capture a photo to check safety compliance',
    'requirements_met': {
        'hard_hat': False,
        'vest': False,
        'minimum_score': False
    }
}
lock = threading.Lock()
camera = None
latest_frame = None


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def analyze_safety(image):
    """Analyze image and return safety assessment with strict construction rules"""
    if model is None:
        return {
            'hard_hat': 0,
            'vest': 0,
            'no_hard_hat': 0,
            'no_vest': 0,
            'safety_score': 0,
            'access_granted': False,
            'message': 'Safety system not available',
            'requirements_met': {
                'hard_hat': False,
                'vest': False,
                'minimum_score': False
            }
        }

    try:
        # Run YOLO detection with confidence 0.7
        results = model(image, conf=0.7, imgsz=640)

        # Initialize counts
        hard_hat = 0
        vest = 0
        no_hard_hat = 0
        no_vest = 0

        # Process detections
        detections = results[0].boxes
        if detections is not None:
            for detection in detections:
                class_id = int(detection.cls[0])
                class_name = model.names[class_id]

                if class_name == 'hard-hat':
                    hard_hat += 1
                elif class_name == 'vest':
                    vest += 1
                elif class_name == 'no-hard-hat':
                    no_hard_hat += 1
                elif class_name == 'no-vest':
                    no_vest += 1

        print(f"DEBUG - Detections: hard_hat={hard_hat}, vest={vest}, no_hard_hat={no_hard_hat}, no_vest={no_vest}")

        # FIXED SAFETY SCORE CALCULATION
        # Score is based on presence of required equipment and absence of violations
        total_persons = max(hard_hat + no_hard_hat, vest + no_vest, 1)  # At least 1 person assumed

        if total_persons == 0:
            # If no persons detected at all
            safety_score = 0
        else:
            # Calculate compliance percentage
            persons_with_hat = hard_hat
            persons_with_vest = vest
            persons_without_hat = no_hard_hat
            persons_without_vest = no_vest

            # Safety score: percentage of persons with proper equipment
            hat_compliance = (persons_with_hat / total_persons) * 50  # 50% weight for hard hat
            vest_compliance = (persons_with_vest / total_persons) * 50  # 50% weight for vest

            safety_score = hat_compliance + vest_compliance

        # STRICT CONSTRUCTION SAFETY RULES
        # Access is granted ONLY if:
        # 1. At least one hard hat is detected AND no "no-hard-hat" violations
        # 2. At least one safety vest is detected AND no "no-vest" violations
        # 3. Safety score is at least 50%
        hard_hat_required = hard_hat > 0 and no_hard_hat == 0
        vest_required = vest > 0 and no_vest == 0
        meets_minimum_score = safety_score >= 50

        # Access decision - ALL conditions must be met
        access_granted = hard_hat_required and vest_required and meets_minimum_score

        # Generate appropriate message
        if access_granted:
            message = "✅ ACCESS GRANTED - All safety requirements met"
        else:
            reasons = []
            if not hard_hat_required:
                if no_hard_hat > 0:
                    reasons.append(f"{no_hard_hat} person(s) without hard hat")
                elif hard_hat == 0:
                    reasons.append("No hard hat detected")
            if not vest_required:
                if no_vest > 0:
                    reasons.append(f"{no_vest} person(s) without safety vest")
                elif vest == 0:
                    reasons.append("No safety vest detected")
            if not meets_minimum_score:
                reasons.append(f"Safety score {safety_score:.1f}% below 50%")

            message = f"🚫 ACCESS DENIED - {', '.join(reasons)}"

        # Create annotated image
        annotated_image = results[0].plot() if len(results) > 0 else image

        # Add safety info to annotated image
        status_color = (0, 255, 0) if access_granted else (0, 0, 255)
        cv2.putText(annotated_image, f"Safety Score: {safety_score:.1f}%",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
        cv2.putText(annotated_image, f"Status: {'ALLOWED' if access_granted else 'DENIED'}",
                    (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
        cv2.putText(annotated_image, f"Hard Hats: {hard_hat} | No Hat: {no_hard_hat}",
                    (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, status_color, 1)
        cv2.putText(annotated_image, f"Safety Vests: {vest} | No Vest: {no_vest}",
                    (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.5, status_color, 1)

        return {
            'hard_hat': hard_hat,
            'vest': vest,
            'no_hard_hat': no_hard_hat,
            'no_vest': no_vest,
            'safety_score': round(safety_score, 1),
            'access_granted': access_granted,
            'message': message,
            'requirements_met': {
                'hard_hat': hard_hat_required,
                'vest': vest_required,
                'minimum_score': meets_minimum_score
            },
            'annotated_image': annotated_image
        }

    except Exception as e:
        print(f"Error in analyze_safety: {e}")
        return {
            'hard_hat': 0,
            'vest': 0,
            'no_hard_hat': 0,
            'no_vest': 0,
            'safety_score': 0,
            'access_granted': False,
            'message': f'Analysis error: {str(e)}',
            'requirements_met': {
                'hard_hat': False,
                'vest': False,
                'minimum_score': False
            }
        }


def generate_frames():
    global camera, latest_frame

    try:
        camera = cv2.VideoCapture(0)
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

        while True:
            success, frame = camera.read()
            if not success:
                break

            # Store the latest frame for capture
            latest_frame = frame.copy()

            # Add "LIVE" indicator to the frame
            cv2.putText(frame, "LIVE SURVEILLANCE", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(frame, "Press 'CAPTURE & ANALYZE' to check safety", (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

            # Encode frame for streaming
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    except Exception as e:
        print(f"Error in generate_frames: {e}")
    finally:
        if camera:
            camera.release()


@app.route('/')
def index():
    return render_template('indext.html')


@app.route('/video_feed')
def video_feed():
    try:
        return Response(generate_frames(),
                        mimetype='multipart/x-mixed-replace; boundary=frame')
    except Exception as e:
        print(f"Error in video_feed: {e}")
        return "Video feed error", 500


@app.route('/capture_photo', methods=['POST'])
def capture_photo():
    """Capture current frame from webcam and analyze it"""
    global latest_frame

    try:
        if latest_frame is None:
            return jsonify({'error': 'No frame available from camera'}), 400

        # Analyze the captured frame
        safety_data = analyze_safety(latest_frame)

        # Save annotated image
        unique_filename = f"{uuid.uuid4().hex}_captured.jpg"
        output_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        cv2.imwrite(output_path, safety_data['annotated_image'])

        # Update global detection data
        with lock:
            global current_detection
            current_detection = safety_data

        return jsonify({
            'success': True,
            'safety_score': safety_data['safety_score'],
            'access_granted': safety_data['access_granted'],
            'message': safety_data['message'],
            'detections': {
                'hard_hat': safety_data['hard_hat'],
                'vest': safety_data['vest'],
                'no_hard_hat': safety_data['no_hard_hat'],
                'no_vest': safety_data['no_vest']
            },
            'requirements_met': safety_data['requirements_met'],
            'analyzed_image_url': f'/uploads/{unique_filename}'
        })

    except Exception as e:
        print(f"Error in capture_photo: {e}")
        return jsonify({'error': f'Capture error: {str(e)}'}), 500


@app.route('/upload_photo', methods=['POST'])
def upload_photo():
    try:
        if 'photo' not in request.files:
            return jsonify({'error': 'No photo file provided'}), 400

        file = request.files['photo']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if file and allowed_file(file.filename):
            # Read image file
            image_data = file.read()
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if image is None:
                return jsonify({'error': 'Invalid image file'}), 400

            # Analyze safety
            safety_data = analyze_safety(image)

            # Save annotated image
            unique_filename = f"{uuid.uuid4().hex}_uploaded.jpg"
            output_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            cv2.imwrite(output_path, safety_data['annotated_image'])

            # Update global detection data
            with lock:
                global current_detection
                current_detection = safety_data

            return jsonify({
                'success': True,
                'safety_score': safety_data['safety_score'],
                'access_granted': safety_data['access_granted'],
                'message': safety_data['message'],
                'detections': {
                    'hard_hat': safety_data['hard_hat'],
                    'vest': safety_data['vest'],
                    'no_hard_hat': safety_data['no_hard_hat'],
                    'no_vest': safety_data['no_vest']
                },
                'requirements_met': safety_data['requirements_met'],
                'analyzed_image_url': f'/uploads/{unique_filename}'
            })

        return jsonify({'error': 'Invalid file type. Please upload an image.'}), 400

    except Exception as e:
        print(f"Error in upload_photo: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/current_status')
def current_status():
    """Get current detection status"""
    with lock:
        return jsonify(current_detection)


if __name__ == '__main__':
    print("🏗️ Construction Safety Access Control System")
    print("============================================")
    print("Safety Rules:")
    print("• Hard hat REQUIRED (no violations allowed)")
    print("• Safety vest REQUIRED (no violations allowed)")
    print("• Minimum safety score: 50%")
    print("• Access granted only when ALL requirements are met")
    print("============================================")
    print("🎥 Live surveillance activated")
    app.run(debug=True, host='0.0.0.0', port=5000)