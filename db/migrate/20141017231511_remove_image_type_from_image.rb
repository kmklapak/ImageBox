class RemoveImageTypeFromImage < ActiveRecord::Migration
  def change
    remove_column :images, :image_type, :string
  end
end
