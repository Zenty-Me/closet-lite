import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Wardrobe } from './pages/Wardrobe'
import { ItemForm } from './pages/ItemForm'
import { Outfits } from './pages/Outfits'
import { OutfitForm } from './pages/OutfitForm'
import { OutfitDetail } from './pages/OutfitDetail'
import { Calendar } from './pages/Calendar'
import { Profile } from './pages/Profile'
import { Inspire } from './pages/Inspire'
import { InspireForm } from './pages/InspireForm'
import { RecycleBin } from './pages/RecycleBin'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Wardrobe />} />
          <Route path="items/:id" element={<ItemForm />} />
          <Route path="outfits" element={<Outfits />} />
          <Route path="outfits/new" element={<OutfitForm />} />
          <Route path="outfits/:id/edit" element={<OutfitForm />} />
          <Route path="outfits/:id" element={<OutfitDetail />} />
          <Route path="inspire" element={<Inspire />} />
          <Route path="inspire/:id" element={<InspireForm />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="me" element={<Profile />} />
          <Route path="recycle" element={<RecycleBin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
