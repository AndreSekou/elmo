require 'spec_helper'

describe Option do
  before(:all) do
    @mission1 = create(:mission)
    @mission2 = create(:mission)
  end

  describe 'to_mission' do
    before do
      @orig = create(:option, name_en: 'Foo', is_standard: true)
      @copy = @orig.replicate(mode: :to_mission, dest_mission: @mission2)
    end

    describe 'on create' do
      subject { @copy }
      its(:mission) { should eq @mission2 }
      its(:name_en) { should eq 'Foo'}
      its(:standard) { should eq @orig }
      its(:is_standard) { should be_falsey }
    end

    describe 'on update' do
      before do
        @orig.name_en = 'Bar'
        @orig.save_and_rereplicate!
      end

      subject { @copy.reload }

      its(:name_en) { should eq 'Bar' }
    end

    describe 'on update after copy name change' do
      before do
        @copy.update_attributes(name_en: 'Baz')
        @orig.name_en = 'Noop'
        @orig.save_and_rereplicate!
      end

      subject { @copy.reload }

      # Should not change to Noop
      its(:name_en) { should eq 'Baz' }
    end

    describe 'on destroy' do
      before { @orig.destroy_with_copies }

      it 'should destroy copies' do
        expect(Option.exists?(@copy)).to be_falsey
      end
    end
  end

  describe 'clone' do
    # Option clone is not supported
  end

  describe 'promote with link' do
    before(:all) do
      @orig = create(:option, name_en: 'Foo', mission: @mission1)
      @copy = @orig.replicate(mode: :promote, retain_link_on_promote: true)
    end

    it 'should create correct copy' do
      expect(@copy.mission).to be_nil
      expect(@copy.name_en).to eq 'Foo'
      expect(@copy.standard).to be_nil
      expect(@copy.is_standard).to eq true
    end

    it 'should maintain link' do
      expect(@orig.reload.standard).to eq @copy
    end
  end
end
