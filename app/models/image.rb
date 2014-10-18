class Image < ActiveRecord::Base
  belongs_to :user

  validates :file, presence: true
  validates :user, presence: true
  validates :title, length: {maximum: 100}

  mount_uploader :file, ImageUploader


  self.per_page = 8
end
