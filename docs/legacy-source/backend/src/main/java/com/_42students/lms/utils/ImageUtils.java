package com._42students.lms.utils;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

import javax.imageio.ImageIO;

import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.stereotype.Component;

@Component
public class ImageUtils {
    public File cropImage(File originalImage, int xMax, int yMax, int xMin, int yMin) throws IOException {
    
        // Reading original image from local path by
        // creating an object of BufferedImage class
        BufferedImage originalImg = ImageIO.read(
            originalImage);

        // Creating a subimage of given dimensions
        BufferedImage subImg
            = originalImg.getSubimage(xMin, yMin, xMax-xMin, yMax-yMin);

        // Creating new file for cropped image by
        // creating an object of File class
        File outputfile
            = File.createTempFile(RandomStringUtils.randomAlphanumeric(16), ".jpg");

        // Writing image in new file created
        ImageIO.write(subImg, "jpg", outputfile);
        return outputfile;
    }
}

