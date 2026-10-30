import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import { api, ApiError, toApiError } from '../api'
import type { PendingPhoto, PhotoResult } from '../api'
import ErrorMessage from '../components/ErrorMessage'
import { useFormat } from '../useFormat'
import NewInvoice from './NewInvoice'

// Adding an invoice from a photo (Stage 4): take or choose a photo -> the
// AI reads it (backend photo_routes.py) -> the person checks the
// pre-filled form beside the photo and saves it.
export default function PhotoInvoice() {
  const { id } = useParams()
  // `key`: a different photo starts with fresh state
  return id ? <PhotoResultView key={id} photoId={Number(id)} /> : <ChoosePhoto />
}

function ChoosePhoto() {
  const { t } = useTranslation()
  const format = useFormat()
  const navigate = useNavigate()
  const [pending, setPending] = useState<PendingPhoto[]>([])
  const [error, setError] = useState<ApiError | null>(null)
  const [reading, setReading] = useState(false)

  useEffect(() => {
    api
      .get<PendingPhoto[]>('/api/invoice-photos')
      .then(setPending)
      .catch((e) => setError(toApiError(e)))
  }, [])

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError(null)
    setReading(true)
    const form = new FormData()
    form.append('photo', file)
    try {
      const result = await api.upload<PhotoResult>('/api/invoice-photos', form)
      // hand the result over, so the next page needn't ask for it again
      navigate(`/add/${result.id}`, { state: result })
    } catch (e) {
      setError(toApiError(e))
      setReading(false)
    }
  }

  return (
    <div className="page">
      <h1>{t('photo.title')}</h1>
      <p className="muted">{t('photo.hint')}</p>
      <ErrorMessage error={error} />
      {reading ? (
        <p className="notice notice-ok" role="status">
          {t('photo.reading')}
        </p>
      ) : (
        <div className="home-actions">
          {/* the whole button is the label: tapping it opens camera or files */}
          <label className="btn btn-primary btn-large btn-block file-button">
            {t('photo.choose')}
            <input type="file" accept="image/*" className="sr-only" onChange={upload} />
          </label>
          <Link className="btn btn-quiet" to="/invoices/new">
            {t('home.typeInstead')}
          </Link>
        </div>
      )}

      {pending.length > 0 && (
        <>
          <h2>{t('photo.pending')}</h2>
          <ul className="list">
            {pending.map((photo) => (
              <li key={photo.id}>
                <Link className="list-row" to={`/add/${photo.id}`}>
                  <span className="list-row-main">
                    <span className="list-row-title">{format.dateTime(photo.uploaded_at)}</span>
                    <span className="list-row-meta">{photo.uploaded_by}</span>
                  </span>
                  <span className={photo.status === 'read' ? 'badge badge-ok' : 'badge badge-warn'}>
                    {t(`photo.status.${photo.status}`)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function PhotoResultView({ photoId }: { photoId: number }) {
  const { t } = useTranslation()
  const location = useLocation()
  // straight after uploading, the result came along with the navigation
  const [result, setResult] = useState<PhotoResult | null>(
    (location.state as PhotoResult | null) ?? null,
  )
  const [handTyping, setHandTyping] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [reading, setReading] = useState(false)

  useEffect(() => {
    if (location.state) return
    api
      .get<PhotoResult>(`/api/invoice-photos/${photoId}`)
      .then(setResult)
      .catch((e) => setError(toApiError(e)))
  }, [photoId, location.state])

  async function readAgain() {
    setError(null)
    setReading(true)
    try {
      setResult(await api.post<PhotoResult>(`/api/invoice-photos/${photoId}/read`, {}))
    } catch (e) {
      setError(toApiError(e))
    } finally {
      setReading(false)
    }
  }

  if (!result) {
    return (
      <div className="page">
        {error ? <ErrorMessage error={error} /> : <p className="muted">{t('common.loading')}</p>}
      </div>
    )
  }

  const imageUrl = `/api/invoice-photos/${photoId}/image`
  // tapping the photo opens it full size, where it can be zoomed
  const photo = (
    <a href={imageUrl} target="_blank" rel="noopener" className="invoice-photo">
      <img src={imageUrl} alt={t('review.photoAlt')} />
    </a>
  )

  if (result.invoice_id) {
    return (
      <div className="page">
        <h1>{t('photo.title')}</h1>
        <div className="notice notice-ok">
          <p>{t('photoError.alreadyUsed')}</p>
        </div>
        <Link className="btn" to={`/review/${result.invoice_id}`}>
          {t('photo.openInvoice')}
        </Link>
      </div>
    )
  }

  if (result.status === 'read' || handTyping) {
    return (
      <div className="photo-layout">
        <div className="photo-layout-photo">{photo}</div>
        <NewInvoice draft={handTyping ? null : result.draft} photoId={photoId} />
      </div>
    )
  }

  // not read: the AI was unreachable ("waiting") or couldn't read it ("failed")
  return (
    <div className="page">
      <h1>{t('photo.title')}</h1>
      <div className="notice notice-warn">
        <p>{t(result.status === 'waiting' ? 'photo.waiting' : 'photo.failed')}</p>
      </div>
      <ErrorMessage error={error} />
      {reading ? (
        <p className="notice notice-ok" role="status">
          {t('photo.reading')}
        </p>
      ) : (
        <div className="cluster after-list">
          <button type="button" className="btn btn-primary" onClick={readAgain}>
            {t('photo.tryAgain')}
          </button>
          <button type="button" className="btn" onClick={() => setHandTyping(true)}>
            {t('photo.typeByHand')}
          </button>
        </div>
      )}
      <div className="after-list">{photo}</div>
    </div>
  )
}
