class AddOriginalNameToImage < ActiveRecord::Migration
  def change
    add_column :images, :original_name, :string
  end
end
