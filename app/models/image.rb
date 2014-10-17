class Image < ActiveRecord::Base
  belongs_to :user
  mount_uploader :file, ImageUploader
  self.per_page = 8
end
