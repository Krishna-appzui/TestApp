#! /usr/bin/env macruby

pngFiles = Dir.glob("**/*.png")

pngFiles.each { |filename| 
  unless filename.end_with? "@2x.png" or filename.start_with? "build/"
    
    retinaFilename = filename[0..-5] + "@2x.png"
    errors = []
    
    if pngFiles.index(retinaFilename) 
      imageRep = NSImage.alloc.initByReferencingFile(filename).representations[0]
      retinaImageRep = NSImage.alloc.initByReferencingFile(retinaFilename).representations[0]
      
      if imageRep != nil and retinaImageRep != nil and (retinaImageRep.pixelsWide != (imageRep.pixelsWide * 2) or retinaImageRep.pixelsHigh  != (imageRep.pixelsHigh * 2))
        errors << "Normal and retina image sizes don't match! Image is #{imageRep.pixelsWide}x#{imageRep.pixelsHigh}. Retina image is #{retinaImageRep.pixelsWide}x#{retinaImageRep.pixelsHigh} but it should be #{imageRep.pixelsWide * 2}x#{imageRep.pixelsHigh * 2}"
      elsif imageRep == nil
        errors << "#{filename} is an invalid png file!"
      elsif retinaImageRep == nil
        errors << "#{filename} is an invalid png file!"
      end
        
    else
      errors << "Missing retina version!"
    end
    
    if (errors.length > 0)
      puts filename + ":"
      errors.each {|errorString|
        puts "    " + errorString
      }
      puts "\n"
    end
  end
}