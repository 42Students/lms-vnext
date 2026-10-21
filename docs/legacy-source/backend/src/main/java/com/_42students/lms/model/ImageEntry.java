package com._42students.lms.model;

public class ImageEntry {

    private String imageId;
    private String imageUrl;
    private int active;

    public ImageEntry(String imageId, String imageUrl, int active) {
        this.imageId = imageId;
        this.imageUrl = imageUrl;
        this.active = active;
    }

    public String getImageId() {
        return imageId;
    }

    public void setImageId(String imageId) {
        this.imageId = imageId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public int getActive() {
        return active;
    }

    public void setActive(int active) {
        this.active = active;
    }
}

