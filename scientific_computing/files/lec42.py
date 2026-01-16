import cv2
import numpy as np
import matplotlib.pyplot as plt

#vid = cv2.VideoCapture("balloon.mp4");
vid = cv2.VideoCapture("visc.MOV");

while True:

    ret, img = vid.read()
    b, g, r = cv2.split(img.astype(float))

    # channel mixing
    c1 = -2.12; c2 = 0.245; c3 = 1.359;
    isolated = c1*g + c2*b + c3*r; 
    isolated = np.clip(isolated, 0, 255)
    isolated = isolated.astype(img.dtype)
    cv2.imshow("mixed channel; before blurring", isolated)

    # gaussian blur
    imgblur = cv2.GaussianBlur(isolated, (21,21), 0);
    #cv2.imshow("After blurring", imgblur)

    # Thresholded the image
    ret, imgth = cv2.threshold(imgblur, 80, 255, cv2.THRESH_BINARY)
    #cv2.imshow("Thresholded image", imgth)
    
    edge = cv2.Canny(imgth, 100, 150);
    #cv2.imshow("Edges of the image", edge);
    #cv2.waitKey(0)

    cv2.waitKey(1)

