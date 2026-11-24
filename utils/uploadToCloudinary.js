const streamifier = require("streamifier")
const cloudinary = require("./cloudinary")

/**
 * Upload a single buffer to Cloudinary
 * @param {Buffer} buffer - file buffer from multer memoryStorage
 * @param {Object} options - cloudinary upload options
 * @returns {Promise<{url: string, public_id: string}>}
 */
function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: options.folder || "healery/products", resource_type: "image", ...options },
      (error, result) => {
        if (error) return reject(error)
        resolve({ url: result.secure_url, public_id: result.public_id })
      },
    )

    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}

module.exports = { uploadBuffer }


