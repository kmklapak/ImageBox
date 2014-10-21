class AddBatchToImage < ActiveRecord::Migration
  def change
    add_column :images, :batch, :string
  end
end