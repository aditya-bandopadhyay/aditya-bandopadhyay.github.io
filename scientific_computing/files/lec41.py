import cv2
import numpy as np
import matplotlib.pyplot as plt

vid = cv2.VideoCapture("balloon.mp4");

while True:

    ret, img = vid.read()
    b, g, r = cv2.split(img.astype(float))

    # channel mixing
    c1 = 1.5; c2 = -2; c3 = -0.1;
    isolated = c1*g + c2*b + c3*r; 
    isolated = np.clip(isolated, 0, 255)
    isolated = isolated.astype(img.dtype)
    #cv2.imshow("mixed channel; before blurring", isolated)

    # gaussian blur
    imgblur = cv2.GaussianBlur(isolated, (21,21), 0);
    #cv2.imshow("After blurring", imgblur)

    # Thresholded the image
    ret, imgth = cv2.threshold(imgblur, 80, 255, cv2.THRESH_BINARY)
    #cv2.imshow("Thresholded image", imgth)
    
    edge = cv2.Canny(imgth, 100, 150);
    #cv2.imshow("Edges of the image", edge);
    #cv2.waitKey(0)
    contours, heirarchy = cv2.findContours(edge, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    
    contours = list(contours)
    selectedcontour = contours[0].copy # Initialization of the variable
    for contour in contours:
        if cv2.contourArea(contour) > 2000:
            selectedcontour = contour
    
    #cv2.drawContours(img, np.array([selectedcontour]),0, (0, 0, 255), 3)
    #cv2.imshow("image with contour", img);
   

    ca = cv2.contourArea(contours[0])
    cl = cv2.arcLength(contours[0], True)
    print("%f\t %f"%(ca, cl));
    cv2.waitKey(1)

