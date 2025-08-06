
const fs = require('fs');
const path = require('path');



module.exports.deleteImageFile = (imagePath) => {
  if (imagePath) {
    const fullPath = path.join('./public', imagePath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        console.log('Deleted old image:', fullPath);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }
  }
};


module.exports.validateBlogData = (heading, description) => {
  const errors = [];
  
  if (!heading || heading.trim().length === 0) {
    errors.push('Heading is required');
  }
  
  if (!description) {
    errors.push('Description is required');
  }
  
  if (heading && heading.trim().length > 200) {
    errors.push('Heading must be less than 200 characters');
  }
  
  return errors;
};



 module.exports.validateCarouselData = (name, heading, subheading) => {
  const errors = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Section name is required');
  }
  
  if (!heading || heading.trim().length === 0) {
    errors.push('Heading is required');
  }
  
  if (!subheading || subheading.trim().length === 0) {
    errors.push('Subheading is required');
  }
  
  
  if (!heading ) {
    errors.push('Heading must be required');
  }
  
  if (subheading && subheading.trim().length > 300) {
    errors.push('Subheading must be less than 300 characters');
  }
  
  return errors;
};