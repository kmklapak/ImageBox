class Image < ActiveRecord::Base
  before_save :default_title
  include FriendlyId
  friendly_id :uuid

  belongs_to :user

  validates :file, presence: true
  validates :user, presence: true
  validates :title, length: {maximum: 100}

  mount_uploader :file, ImageUploader

  self.per_page = 8


  def download_url
    obj = AWS::S3.new.buckets[ENV['S3_BUCKET']].objects[self.file.path]

    obj.url_for( :read,
                expires_in: 60.minutes,
                use_ssl: true,
                response_content_disposition: "attachment; filename=#{self.original_name}" ).to_s


  end

  private
  def default_title
    if self.title == ""
      self.title = self.original_name
    end
  end

end
