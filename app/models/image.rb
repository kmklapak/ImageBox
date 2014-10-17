class Image < ActiveRecord::Base
  belongs_to :user
  mount_uploader :file, ImageUploader
end
